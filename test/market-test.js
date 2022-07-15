const { expect } = require("chai");

describe("Listing of NFT", function () {
  this.beforeEach(async function () {
    const Artwork = await ethers.getContractFactory("Artwork");
    const Marketplace = await ethers.getContractFactory("Marketplace");

    nftContract1 = await Artwork.deploy("Artwork Contract", "ART");
    marketplace = await Marketplace.deploy();

    [account1] = await ethers.getSigners();
    const tokenURI1 =
      "https://opensea-creatures-api.herokuapp.com/api/creature/1";
    const tokenURI2 =
      "https://opensea-creatures-api.herokuapp.com/api/creature/2";

    await nftContract1.connect(account1).mint(tokenURI1);
    await nftContract1.connect(account1).mint(tokenURI2);

    await nftContract1.connect(account1).approve(marketplace.address, 0);
  });

  it("NFT is successfully listed", async function () {
    await marketplace
      .connect(account1)
      .listMarketItem(nftContract1.address, 0, ethers.utils.parseEther("0.1"), {
        value: ethers.utils.parseEther("0.01"),
      });

    const listedNFT = await marketplace.getMarketItem(0);
    expect(listedNFT.nftContractAddress).to.equal(nftContract1.address);
    expect(listedNFT.price).to.equal(ethers.utils.parseEther("0.1"));
  });

  it("NFT can't be listed if listing price is not paid", async function () {
    await expect(
      marketplace
        .connect(account1)
        .listMarketItem(
          nftContract1.address,
          0,
          ethers.utils.parseEther("0.1"),
          {
            value: ethers.utils.parseEther("0"),
          }
        )
    ).to.be.revertedWith("Must pay the listing price");
  });

  it("NFT can't be listed if NFT is not approved by user", async function () {
    await expect(
      marketplace
        .connect(account1)
        .listMarketItem(
          nftContract1.address,
          1,
          ethers.utils.parseEther("0.1"),
          {
            value: ethers.utils.parseEther("0.01"),
          }
        )
    ).to.be.revertedWith("ERC721: caller is not token owner nor approved");
  });
});

describe("Buying of NFT", function () {
  this.beforeEach(async function () {
    const Artwork = await ethers.getContractFactory("Artwork");
    const Marketplace = await ethers.getContractFactory("Marketplace");

    nftContract1 = await Artwork.deploy("Artwork Contract", "ART");
    marketplace = await Marketplace.deploy();

    [account1, account2] = await ethers.getSigners();
    const tokenURI =
      "https://opensea-creatures-api.herokuapp.com/api/creature/1";

    await nftContract1.connect(account1).mint(tokenURI);
    await nftContract1.connect(account1).approve(marketplace.address, 0);
    await marketplace
      .connect(account1)
      .listMarketItem(nftContract1.address, 0, ethers.utils.parseEther("0.1"), {
        value: ethers.utils.parseEther("0.01"),
      });
  });

  it("Buying NFT", async function () {
    prevBalance = await nftContract1.balanceOf(account2.address);
    await marketplace
      .connect(account2)
      .buyMarketItem(0, { value: ethers.utils.parseEther("0.1") });
    presentBalance = await nftContract1.balanceOf(account2.address);

    expect(prevBalance).to.equal(0);
    expect(presentBalance).to.equal(1);
  });

  it("NFT can't be bought by paying a lower price", async function () {
    await expect(
      marketplace
        .connect(account2)
        .buyMarketItem(0, { value: ethers.utils.parseEther("0.01") })
    ).to.be.revertedWith("Must pay the correct price");
  });

  it("NFT can't be bought twice", async function () {
    await marketplace
      .connect(account2)
      .buyMarketItem(0, { value: ethers.utils.parseEther("0.1") });
    await expect(
      marketplace
        .connect(account2)
        .buyMarketItem(0, { value: ethers.utils.parseEther("0.1") })
    ).to.be.revertedWith("Item is already sold");
  });
});
